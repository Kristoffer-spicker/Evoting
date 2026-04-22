import random
from typing import Annotated
import os
import httpx # pylint: disable=import-error
from sqlalchemy import Column # type: ignore # pylint: disable=import-error
from sqlalchemy.dialects.postgresql import JSONB # type: ignore # pylint: disable=import-error
from fastapi import FastAPI, Depends, Query, HTTPException # type: ignore # pylint: disable=import-error
from fastapi.middleware.cors import CORSMiddleware # type: ignore # pylint: disable=import-error
from sqlmodel import Field, Session, SQLModel, create_engine, select  # type: ignore # pylint: disable=import-error
from pydantic import BaseModel # type: ignore # pylint: disable=import-error
app = FastAPI(root_path="/api")

class Candidate(SQLModel, table=True):
    __tablename__ = "candidates"
    id: int = Field(primary_key=True)
    curve_p: dict = Field(sa_column=Column(JSONB))

class Teller(SQLModel, table=True):
    __tablename__ = "tellers"
    id: str = Field(primary_key=True)
    t_pk: str

class qrCodeRequest(BaseModel):
    voter_id: str

'''
Class to create the values we need for voting
'''
class CastVoteRequest(BaseModel):
    voter_id: str
    vote_value: int
    secretkey: str

connect_args = {"check_same_thread": False}
DATABASE_URL = (
    f"postgresql+psycopg2://"
    f"{os.getenv('DB_USER')}:"
    f"{os.getenv('DB_PASSWORD')}@"
    f"{os.getenv('DB_HOST', 'db')}:"
    f"{os.getenv('DB_PORT', '5432')}/"
    f"{os.getenv('DB_NAME')}"
)

engine = create_engine(DATABASE_URL)
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],    
)

class LogRequest(BaseModel):
    message: str

@app.post("/log")
def log_message(log: LogRequest):
    print(f"[FRONTEND] {log.message}", flush=True)
    return {"status": "ok"}

@app.on_event("startup")
async def on_startup():
    create_db_and_tables()


@app.get("/candidates")
def read_candidates(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[Candidate]:
    candidates = session.exec(select(Candidate).offset(offset).limit(limit)).all()
    return candidates
    
@app.get("/candidates/{candidate_id}", response_model=Candidate)
def read_candidate(candidate_id: int, session: SessionDep) -> Candidate:
    candidate = session.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate    

@app.post("/addcandidates/")
def create_candidate(candidate: Candidate, session: SessionDep) -> Candidate:
    session.add(candidate)
    session.commit()
    session.refresh(candidate)
    return candidate

@app.get("/getTallyKey")
def get_tally_key(session: SessionDep):
    tally = session.exec(select(Teller)).all()
    random_teller = random.choice(tally)
    return random_teller.t_pk

@app.post("/qrcode")
async def qrcode(request: qrCodeRequest):
    secret_key = os.getenv("SECRET_KEY")
    async with httpx.AsyncClient() as client:
        try:
            qrdata = await client.post(
                "http://cast_app:8001/qrcodegen",
                json={
                    "id": request.voter_id,
                    "secretkey": secret_key,
                },
                timeout=30.0
            )
            return qrdata.json()
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail="cast_app rejected the rquest")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Could not reach cast_app")

    

@app.post("/castvote")

async def cast_vote(request: CastVoteRequest):
    '''
    cast_vote: exposes a POST /castvote endpoint that allows casting a vote through the API.
    Takes a voter_id and vote_value, then forwards them to cast_app on port 8001.
    Uses a shared SECRET_KEY in the request header to authenticate with cast_app,
    ensuring only the API can trigger the voting function.
    '''
    secret_key = os.getenv("SECRET_KEY")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "http://cast_app:8001/trigger",
                json={
                    "id": request.voter_id,
                    "vote_value": request.vote_value,
                    "secretkey": request.secretkey,
                },
                headers={"x-api-key": secret_key},
                timeout=30.0
            )
            response.raise_for_status()
            return {"status": "vote cast successfully", "voter_id": request.voter_id}
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail="cast_app rejected the rquest")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Could not reach cast_app")


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
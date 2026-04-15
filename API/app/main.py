from typing import Annotated
import os
import psycopg2
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from fastapi import FastAPI, Depends, Query, HTTPException # type: ignore # pylint: disable=import-error
from sqlmodel import Field, Session, SQLModel, create_engine, select  # type: ignore # pylint: disable=import-error

app = FastAPI()

class Candidate(SQLModel, table=True):
    __tablename__ = "candidates"
    id: int = Field(primary_key=True)
    curve_p: dict = Field(sa_column=Column(JSONB))

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


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
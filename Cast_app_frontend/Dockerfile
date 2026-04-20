FROM node:22-alpine as base

WORKDIR /app
COPY . .
RUN npm install
EXPOSE 5174
CMD ["npm", "run", "dev", "--", "--host"]
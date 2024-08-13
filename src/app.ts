import express, { json, urlencoded } from "express";
import cors from 'cors';
import { RegisterRoutes } from "../build/routes";

export const app = express();

app.use(
    urlencoded({
        extended: true,
    })
);
app.use(json());
app.use(cors());

RegisterRoutes(app);
import dotenv from "dotenv";
import "./db";
import app from "./app";

dotenv.config();

const { PORT } = process.env;

const handleListening = () => console.log(`Listening on port: ${PORT}`);

app.listen(PORT, handleListening);

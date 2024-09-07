const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cookiesParser = require("cookie-parser");
const { app, server } = require("./socket/index");
const { default: mongoose } = require("mongoose");
const userRoutes = require("./routes/userRoutes");
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookiesParser());

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  return res.json({
    message: "Server is running on port " + PORT,
  });
});

app.use("/api", userRoutes);
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(err));

server.listen(PORT, () => console.log(`Server is running on ${PORT}`));

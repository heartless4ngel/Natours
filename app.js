"use strict";

const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");

const app = express();
////////////////////////////////////////// MIDDLEWARE USED FOR ALL REQUESTS
app.use(helmet()); //middleware which sets security http headers

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP. Please try again in an hour.",
});

app.use("/api", limiter); //middleware to limit the requests sent in a certain amount of time from an IP
app.use(express.json({ limit: "10kb" })); //middleware to access the body in request
app.use(mongoSanitize()); //middleware for data sanitization against NoSql injection
app.use(xss()); //middleware for data sanitization against xss
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
); //middleware for preventing parameter pollution
app.use(express.static(`${__dirname}/public`)); //middleware to manage static files like imgs, js, css

// app.use((req, res, next) => {
//   req.requestTime = new Intl.DateTimeFormat("it-IT", {
//     month: "long",
//     weekday: "long",
//     day: "2-digit",
//   }).format(new Date());

//   next();
// });

////////////////////////////////////////// ROUTES (MIDDLEWARE USED ONLY WHEN THESE ROUTES ARE REQUESTED)

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

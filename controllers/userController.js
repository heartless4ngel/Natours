"use strict";
const catchAsync = require("../utils/catchAsync");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const handlerFactory = require("./handlerFactory");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = handlerFactory.getAll(User);

exports.getMe = (req, res, next) => {
  // If we want only certain fields:
  const user = {
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  };

  res.status(200).json({
    status: "success",
    data: { user },
  });
};

exports.UpdateMe = catchAsync(async (req, res, next) => {
  //1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /UpdateMyPassword",
        400
      )
    );
  }

  //2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "email");

  //3) Update user document
  /*Since we are not dealing with sensitive data, we can use findByIdAndUpdate and not User.save because there are some fields that are required and we are not updating so we would get some error*/

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.DeleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getUser = handlerFactory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not defined! Please use /signup instead",
  });
};
//DO not update passwords with this
exports.updateUser = handlerFactory.updateOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);

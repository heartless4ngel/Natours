"use strict";
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const modelName = Model.modelName.toLowerCase();

    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No ${modelName} found with that ID`, 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const modelName = Model.modelName.toLowerCase();

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // this option allows to run validators so if I update a document with an invalid name, it throws an error
    });

    if (!doc) {
      return next(new AppError(`No ${modelName} found with that ID`, 404));
    }

    res.status(201).json({
      status: "success",
      data: {
        [modelName]: doc,
      },
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    //merge two objects, in this case the new id and the object sent inside the body
    /*const doc = Object.assign({ id: newId }, req.body);*/
    const modelName = Model.modelName.toLowerCase();

    const doc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        [modelName]: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const modelName = Model.modelName.toLowerCase();
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    //Model.findOne({_id:req.params.id})

    if (!doc) {
      return next(new AppError(`No ${modelName} found with that ID`, 404));
    }

    res.status(200).json({
      status: "success",
      [modelName]: doc,
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //console.log(req.query);
    const modelName = Model.modelName.toLowerCase();
    //to allow for nested GET reviews on tour(hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    //SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: docs.length,
      data: {
        [modelName]: docs,
      },
    });
  });

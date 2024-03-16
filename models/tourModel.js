"use strict";

const mongoose = require("mongoose");
// const validator = require("validator");
// const slugify = require("slugify");

// const User = require("./userModel");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxLength: [
        40,
        "A tour name must have less or equal than 40 characters name",
      ], //only for strings
      minLength: [
        10,
        "A tour name must have more or equal than 10 characters name",
      ], //only for strings
      // validate: [validator.isAlpha, "Tour name must only contains characters"],
    },

    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },

    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },

    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      lowercase: true,
      enum: {
        //only for string
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium or difficult",
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"], //only for numbers and dates
      max: [5, "Rating must be below 5.0"], //only for numbers and dates
      set: val => Math.round(val * 10) / 10, //every time this field gets update, it runs this callback
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },

    priceDiscount: {
      type: Number,
      //it works only when creating new documents, not with update
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: "Discount price ({VALUE}) should be below regular price",
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },

    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String,
      require: [true, "A tour must have an cover image"],
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },

    startLocation: {
      //GeoJson
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  //activating virtual properties
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//adding an index
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

//virtual property called "DurationWeeks"
tourSchema.virtual("durationWeeks").get(function () {
  if (this.duration) return this.duration / 7; //this points to the document
});

//virtual populate
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

// DOCUMENT MIDDLEWARE/HOOK: runs before .save() and .create()
/*
tourSchema.pre("save", async function (next) {
  const guidesPromises = this.guides.map(id => User.findById(id).exec());
  this.guides = await Promise.all(guidesPromises);
  next();
});

tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

 tourSchema.post("save", function (doc, next) {
  next();
 });
*/

//QUERY MIDDLEWARE/HOOK
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  }); //populate is used to show the referenced document inside "guides"
  next();
});

tourSchema.pre(/^find/, function (next) {
  //this regex triggers the callback with find, findOne, findOneAndDelete, findOneAndUpdate...
  this.find({ secretTour: { $ne: true } }); //this points to the query
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  //this regex triggers the callback with find, findOne, findOneAndDelete, findOneAndUpdate...
  console.log(`The query took ${Date.now() - this.start} milliseconds`);
  next();
});

//AGGREGATION MIDDLEWARE/HOOK
tourSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;

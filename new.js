const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const path = require("path");
const cors = require("cors");
const Youtube = require("youtube-api");
const uuid = require("uuid");
const multer = require("multer");
// const upload = multer({ dest: "./uploads" });
const open = require("open");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 5000;

const credentials = require("./credentials.json");

app.use(cors());
app.use(express.json());

const user = process.env.DB_USER;
const password = process.env.DB_PASS;

const uri = `mongodb+srv://${user}:${password}@cluster0.tgh4y.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    console.log("Database Connected Succesfully");
    const database = client.db("edubuddies");
    const courses = database.collection("courses");
    const userCollection = database.collection("users");
    const teachersCollection = database.collection("teachers");
    const allUsersCollection = database.collection("allUsers");

    // get all the course List Here....

    app.get("/courses", async (req, res) => {
      const coursesList = courses.find({});
      const allCoursesList = await coursesList.toArray();
      res.send(allCoursesList);
    });

    // course update status
    app.patch("/courses/:id", async (req, res) => {
      const status = req.body;
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateDoc = { $set: { courseStatus: status.statusName } };
      const result = await courses.updateOne(filter, updateDoc);
      res.json(result);
    });

    /*-------------------------------------------------------------------------------*\
  //////////////////////////////// Users \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
\*-------------------------------------------------------------------------------*/

    //POST API For Users
    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "user";
      console.log(user);
      const result = await userCollection.insertOne(user);
      console.log(result);
      res.json(result);
    });

    //Get Users API
    app.get("/users", async (req, res) => {
      const cursor = userCollection.find({});
      const users = await cursor.toArray();
      res.json(users);
    });

    //Upsert
    app.put("/users", async (req, res) => {
      const user = req.body;
      user.role = "user";
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    //Make Admin
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      console.log("put", user);
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // insert Teacher Data
    app.post("/addTeacher", async (req, res) => {
      const teacher = req.body;
      teacher.role = "teacher";
      console.log(teacher);
      const result = await teachersCollection.insertOne(teacher);
      console.log(result);
      res.json(result);
    });

    // get all teacher from teachers DB
    app.get("/teachers", async (req, res) => {
      const cursor = teachersCollection.find({});
      const teachers = await cursor.toArray();
      res.json(teachers);
    });

    // DELETE Teacher from Teacher db

    app.delete("/deleteTeacher/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await teachersCollection.deleteOne(query);
      console.log(result);
      res.json(result);
    });

    //Make Teacher
    app.put("/users/teacher", async (req, res) => {
      const user = req.body;
      console.log("put", user);
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "teacher" } };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // get all teacher list from user db  base on role
    app.get("/users/teachers", async (req, res) => {
      const cursor = userCollection.find({ role: "teacher" });
      const users = await cursor.toArray();
      res.json(users);
    });

    //Admin Verfication
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // Add a new courses

    app.post("/addCourse", async (req, res) => {
      console.log(req.body);
      const newItem = req.body;
      const result = await courses.insertOne(newItem);
      res.json(result);
    });

    // update video contents

    app.patch("/updateCourseContent/:id", async (req, res) => {
      const id = req.params.id;
      const CourseData = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };

      const fiterData = await courses.findOne(filter);
      const dataa = fiterData.data;
      const arrayLength = dataa.length;
      CourseData.milestone = `milestone ${arrayLength}`;
      fiterData.data.push(CourseData);
      const updateDoc = { $set: { data: fiterData.data } };
      const result = await courses.updateOne(filter, updateDoc);
      res.json(result);
    });

    // delete a course
    app.delete("/deleteCourses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await courses.deleteOne(query);
      console.log(result);
      res.json(result);
    });

    // from Suuny Bhai

    ////////////////////////////////////////////////

    // To update single profile status data
    app.put("/profile", async (req, res) => {
      const filter = { email: user?.email };
      const updatedReq = req.body;
      console.log("Comming form UI", updatedReq);
      const options = { upsert: true };
      const updateFile = {
        $set: {
          fullname: updatedReq.fullname,
          phone: updatedReq.phone,
          about: updatedReq.about,
          photoURL: updatedReq.photoURL,
        },
      };
      const result = await allUsersCollection.updateOne(
        filter,
        updateFile,
        options
      );
      res.json(result);
      console.log("Updated Successfully", result);
    });

    // To update single profile links data
    app.put("/importantlinks", async (req, res) => {
      const filter = { email: user?.email };
      const updatedReq = req.body;
      console.log("Comming form UI", updatedReq);
      const options = { upsert: true };
      const updateFile = {
        $set: {
          importantlinks: {
            cvLink: updatedReq.cvLink,
            githubLink: updatedReq.githubLink,
            portfolio: updatedReq.portfolio,
            linkedinProfile: updatedReq.linkedinProfile,
          },
        },
      };
      const result = await allUsersCollection.updateOne(
        filter,
        updateFile,
        options
      );
      res.json(result);
      console.log("Updated Successfully", result);
    });

    // To update single profile education data
    app.put("/education", async (req, res) => {
      const filter = { email: user?.email };
      const updatedReq = req.body;
      console.log("Comming form UI", updatedReq);
      const options = { upsert: true };
      const updateFile = {
        $set: {
          educationalExp: {
            educationalLevel: updatedReq.educationalLevel,
            degree: updatedReq.degree,
            instituteName: updatedReq.instituteName,
            passingYear: updatedReq.passingYear,
            currentYear: updatedReq.currentYear,
            grade: updatedReq.grade,
          },
        },
      };
      const result = await allUsersCollection.updateOne(
        filter,
        updateFile,
        options
      );
      res.json(result);
      console.log("Updated Successfully", result);
    });

    // To update single profile present address data
    app.put("/presentaddress", async (req, res) => {
      const filter = { email: user?.email };
      const updatedReq = req.body;
      console.log("Comming form UI", updatedReq);
      const options = { upsert: true };
      const updateFile = {
        $set: {
          presentAddress: {
            addressLine1: updatedReq.addressLine1,
            addressLine2: updatedReq.addressLine2,
            city: updatedReq.city,
            state: updatedReq.state,
            phone: updatedReq.phone,
            zip: updatedReq.zip,
            country: updatedReq.country,
          },
        },
      };
      const result = await allUsersCollection.updateOne(
        filter,
        updateFile,
        options
      );
      res.json(result);
      console.log("Updated Successfully", result);
    });

    // To update single profile permanent address data
    app.put("/permanentaddress", async (req, res) => {
      const filter = { email: user?.email };
      const updatedReq = req.body;
      console.log("Comming form UI", updatedReq);
      const options = { upsert: true };
      const updateFile = {
        $set: {
          permanentAddress: {
            addressLine1: updatedReq.addressLine1,
            addressLine2: updatedReq.addressLine2,
            city: updatedReq.city,
            state: updatedReq.state,
            phone: updatedReq.phone,
            zip: updatedReq.zip,
            country: updatedReq.country,
          },
        },
      };
      const result = await allUsersCollection.updateOne(
        filter,
        updateFile,
        options
      );
      res.json(result);
      console.log("Updated Successfully", result);
    });

    //// problem , need to fix/////

    // To update single profile skillset data
    app.put("/skillset/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updatedReq = req.body;
      const options = { upsert: true };
      const fiterData = await allUsersCollection.findOne(filter);
      fiterData.skillset.push(updatedReq);
      const updateFile = {
        $set: {
          skillset: fiterData.skillset,
        },
      };
      const result = await allUsersCollection.updateOne(
        filter,
        updateFile,
        options
      );
      res.json(result);
    });

    //To load single profile data
    app.get("/allusers", async (req, res) => {
      const user = req.query;
      console.log("user", user);
      const result = await allUsersCollection.findOne({ email: user?.email });
      res.send(result);
      console.log("Found one", result);
    });

    //end of the code
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("EDU BUDDIES is Running");
});

app.listen(port, () => {
  console.log("EDU BUDDIES Server is running at port", port);
});
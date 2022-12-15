import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();
const PORT = process.env.PORT||8000;
const MONGO_URL = process.env.MONGO_URL||"mongodb+srv://anand:TmF7ogJ1ALhcWFxO@allproject.p2rbwnr.mongodb.net/?retryWrites=true&w=majority";

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("<h3>Server is Live!!</h3>");
});

const createConnection = async () => {
  const client = new MongoClient(MONGO_URL);
  await client.connect();

  console.log(`MongoDb connection Established 💞`);

  return client;
};

//endpoint to add mentor
const client = await createConnection();

app.post("/create-mentor", async (req, res) => {
  const data = req.body;

  const result = await client
    .db("mentor-student")
    .collection("mentors")
    .insertOne(data);

  result.acknowledged
    ? res.status(200).send({ msg: "mentor added sucessfully !!" })
    : res
        .status(400)
        .send({ msg: "something went wrong !! please try again later" });
});

//endpoint to list all the mentors
app.get("/mentor-list", async (req, res) => {
  const result = await client
    .db("mentor-student")
    .collection("mentors")
    .find({})
    .toArray();

  res.send(result);
});

//endpoint to add student
app.post("/create-student", async (req, res) => {
  const data = req.body;

  const result = await client
    .db("mentor-student")
    .collection("students")
    .insertOne(data);

  result.acknowledged
    ? res.status(200).send({ msg: "Student added sucessfully" })
    : res
        .status(400)
        .send({ msg: "Something went wrong !! please try again later" });
});

//endpoint to list all the students that are not assigned a mentor:
app.get("/unassigned_students", async (req, res) => {
  const result = await client
    .db("mentor-student")
    .collection("students")
    .find({ mentor_assigned: false })
    .toArray();

  res.send(result);
});

//endpoint to list all the students that are assigned a mentor:
app.get("/assigned_students", async (req, res) => {
  const result = await client
    .db("mentor-student")
    .collection("students")
    .find({ mentor_assigned: true })
    .toArray();

  res.send(result);
});

//endpoint to assign students to a mentor
app.post("/assign_mentor", async (req, res) => {
  const data = req.body;

  const result = await client
    .db("mentor-student")
    .collection("mentors")
    .updateOne(
      { mentor_name: data.mentor_name },
      { $set: { students_assigned: data.students_assigned } }
    );

  data.students_assigned.map(async (student) => {
    await client
      .db("mentor-student")
      .collection("students")
      .updateOne(
        { student_name: student },
        { $set: { mentor_assigned: true, mentor_name: data.mentor_name } }
      );
  });

  result.acknowledged
    ? res.status(200).send({ msg: "students assigned sucessfully !" })
    : res
        .status(400)
        .send({ msg: "something went wrong! please try again later" });
});

//endpoint to update mentor list
app.post("/change_mentor", async (req, res) => {
  const data = req.body;

  await client
    .db("mentor-student")
    .collection("mentors")
    .updateOne(
      { mentor_name: data.previous_mentor },
      { $pull: { students_assigned: data.student_name } }
    );

  await client
    .db("mentor-student")
    .collection("students")
    .updateOne(
      { student_name: data.student_name },
      { $set: { mentor_name: data.new_mentor } }
    );

  const result = await client
    .db("mentor-student")
    .collection("mentors")
    .updateOne(
      { mentor_name: data.new_mentor },
      { $push: { students_assigned: data.student_name } }
    );

  result.acknowledged
    ? res.status(200).send({ msg: "teacher changed sucessfully !!" })
    : res.status(400).send({ msg: "something went wrong!" });
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

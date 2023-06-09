const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
// const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//
//



const uri = `mongodb+srv://${process.env.SUMMER_USER}:${process.env.SUMMER_PASS}@cluster0.jcb1rgs.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const summerCollection = client.db("summerCampCollection").collection("campCollection");
    const usersCollection = client.db("summerCampCollection").collection("users");

    //jwt tokebn 

    app.post("/jwt", (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1h",
        });
        res.send({ token });
      });
  
      //using verify jwt using verify admin
  
      const verifyAdmin = async (req, res, next) => {
        const email = req.decoded.email;
  
        const query = { email: email };
        const user = await summerCollection.findOne(query);
        if (user?.role !== "admin") {
          return res
            .status(403)
            .send({ error: true, message: "forbidden message" });
        }
        next();
      };


      // users collection 

      app.post("/users", async (req, res) => {
        const user = req.body;
  
        const query = { email: user.email };
        const existingEmail = await usersCollection.findOne(query);
  
        if (existingEmail) {
          return res.send({ message: "user Existing Already" });
        }
        const result = await usersCollection.insertOne(user);
        res.send(result);
      });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Summer Camp Is running");
});


app.listen(port, () => {
    console.log(`Summer Camp Running ${port}`);
  });
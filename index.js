const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized access" });
  }

  const token = authorization.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .send({ error: true, message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.TOKEN_SECRET_ACCESS, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .send({ error: true, message: "Unauthorized access" });
    }

    req.decoded = decoded;

    next();
  });
};

//
//
app.get("/", (req, res) => {
  res.send("Summer Camp Is running");
});

const uri = `mongodb+srv://${process.env.SUMMER_USER}:${process.env.SUMMER_PASS}@cluster0.jcb1rgs.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const summerCollection = client
      .db("summerCampCollection")
      .collection("campCollection");
    const usersCollection = client
      .db("summerCampCollection")
      .collection("users");
    const cartsCollection = client
      .db("summerCampCollection")
      .collection("carts");
    const instructorCollection = client
      .db("summerCampCollection")
      .collection("instructor");
    const cartsPaymentItem = client
      .db("summerCampCollection")
      .collection("cartsPayment");

    //jwt tokebn

    app.post("/jwt", (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.TOKEN_SECRET_ACCESS, {
        expiresIn: "30d",
      });

      res.send({ token });
    });

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "Forbidden access" });
      }

      next();
    };

    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user?.role !== "instructor") {
        return res
          .status(403)
          .send({ error: true, message: "Forbidden access" });
      }

      next();
    };

    // cart collection
    app.get("/carts", verifyJwt, async (req, res) => {
      const email = req.query.email;

      if (!email) {
        return res.send([]);
      }
      const query = { email: email };
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }

      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const cartItem = req.body;

      const result = await cartsCollection.insertOne(cartItem);
      res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/carts/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await cartsCollection.findOne(query);
      res.send(result);
    });

    // My  Menu collection

    app.get("/menu", async (req, res) => {
      const result = await summerCollection.find().toArray();
      res.send(result);
    });

    app.post("/menu", async (req, res) => {
      const newItem = req.body;
      const result = await summerCollection.insertOne(newItem);
      res.send(result);
    });

    app.delete("/menu/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await summerCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/menu/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await summerCollection.findOne(query);
      res.send(result);
    });

    // users collection

    app.get("/users", verifyJwt, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;

      const query = { email: user?.email };
      const existingEmail = await usersCollection.findOne(query);

      if (existingEmail) {
        return res.send({ message: "user Existing Already" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Admin Id

    app.get("/users/admin/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    app.patch("/users/admin/:id", verifyJwt, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/users/admin/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/users/admin/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // Instructor Id

    app.get("/instructor", async (req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/instructor/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ instructor: false });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === "instructor" };
      res.send(result);
    });

    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    //

    // Student  Id

    app.get("/users/student/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ student: false });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { student: user?.role === "student" };
      res.send(result);
    });

    app.patch("/users/student/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "student",
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/users/student/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/create-payment-intent/:id", verifyJwt, async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        metadata: {
          id: req.params.id,
        },
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
      });
    });

    app.get("/payment", async (req, res) => {
      const result = await cartsPaymentItem.find().toArray();
      res.send(result);
    });

    app.delete("/payment/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await cartsPaymentItem.deleteOne(query);
      res.send(result);
    });

    app.post("/payments/:id", verifyJwt, async (req, res) => {
      const payment = req.body;
      const id = req.params.id;
      console.log(id);
      const result = await cartsPaymentItem.insertOne(payment);
      const query = { _id: new ObjectId(id) };
      const deletedId = await cartsCollection.deleteOne(query);
      res.send({ result, deletedId });
    });

   
    

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Summer Camp Running ${port}`);
});

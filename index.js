const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { ObjectId } = require("mongodb");
// middleware
app.use(cors({
    origin: ['https://hotel-grandium.web.app',
        'https://hotel-grandium.firebaseapp.com',
        'http://localhost:5173'

    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0r9jhzc.mongodb.net/?retryWrites=true&w=majority`;


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
        client.connect();


        // data collection  
        const serviceCollection = client.db('RoyalDB').collection('services');
        const bookingsCollection = client.db('RoyalDB').collection('bookings');
        const feedbackCollection = client.db('RoyalDB').collection('feedback');

        const logger = (req, res, next) => {
            console.log('log: info', req.method, req.url);
            next();
        }

        const verifyToken = (req, res, next) => {
            const token = req?.cookies?.token;

            if (!token) {
                return res.status(401).send({ message: 'Authorized Error' })
            }
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
                if (error) {
                    return res.status(401).send({ message: 'Access Unauthorized ' })
                }
                req.user = decoded;
                next();
            })
        }

        // app.post('/jwt', logger, async (req, res) => {
        //     const user = req.body;
        //     console.log('user for token', user);
        //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

        //     res.cookie('token', token, {
        //         httpOnly: true,
        //         secure: true,
        //         sameSite: 'none'
        //     })
        //         .send({ success: true });
        // })

        app.post('/jwt', async (req, res) => {
            try {
                const user = req.body
                const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET , {
                    expiresIn: '1d',
                })
                res
                    .cookie('token', token, {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'none'
                    })
                    .send({
                        status: true,
                    })
            } catch (error) {
                res.send({
                    status: true,
                    error: error.message,
                })
            }
        })




        //data delete 
        app.delete('/bookings/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) }
                const result = await bookingsCollection.deleteOne(query);
                res.send(result)
            }
            catch {
                error => console.log(error)
            }

        })

        app.get('/services/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) }
                const result = await serviceCollection.findOne(query);
                res.send(result)
            }
            catch {
                error => console.log(error)
            }

        })
        app.get('/bookings/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) }
                const result = await bookingsCollection.findOne(query);
                res.send(result)
            }
            catch {
                error => console.log(error)
            }

        })

        //http://localhost:5000/services?category=categoryValue
        //http://localhost:5000/services?sortFeild=price&priceOrder=asc

        app.get('/services', logger, async (req, res) => {
            try {
                let queryObject = {}
                let sortObject = {}

                const category = req.query.category;
                const sortField = req.query.sortField
                const sortOrder = req.query.sortOrder

                // pagination 
                const page = Number(req.query.page)
                const limit = Number(req.query.limit)
                const skip = (page - 1) * limit

                if (category) {
                    queryObject.category = category
                }

                if (sortField && sortOrder) {
                    sortObject[sortField] = sortOrder
                }

                const cursor = serviceCollection.find(queryObject).skip(skip).limit(limit).sort(sortObject)
                const result = await cursor.toArray()
                //res.send(result)

                const totalData = await serviceCollection.countDocuments()
                res.send({
                    totalData,
                    result
                }
                )
            }
            catch {
                error => console.log(error)
            }

        })

        //bookings 
        app.post('/bookings', async (req, res) => {
            try {
                const bookings = req.body;
                console.log(bookings);
                const result = await bookingsCollection.insertOne(bookings);
                res.send(result)
            }
            catch {
                error => console.log(error)
            }

        })
        app.post('/feedback', async (req, res) => {
            try {
                const feedback = req.body;
                console.log(feedback);
                const result = await feedbackCollection.insertOne(feedback);
                res.send(result)
            }
            catch {
                error => console.log(error)
            }

        })

        app.get('/bookings',  async (req, res) => {
            try {
                // if (req.query?.email !== req.user.email) {
                //     return res.status(403).send({ message: 'forbidden access' })
                // }
                // console.log(req.cookies.token)
                let query = {}
                if (req.query?.email) {
                    query = { email: req.query.email }
                }
                const result = await bookingsCollection.find(query).toArray();
                res.send(result)
            }
            catch {
                error => console.log(error)
            }


        })


        // //update data
        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedBookings = req.body;
            const bookings = {
                $set: {
                    date: updatedBookings.date
                }
            }
            const result = await bookingsCollection.updateOne(filter, bookings)
            res.send(result);
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Royal Grandium server is running')
})

app.listen(port, () => {
    console.log(`Royal Grandium server is running on port ${port}`)
})

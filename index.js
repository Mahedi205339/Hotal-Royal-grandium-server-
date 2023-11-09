const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require("mongodb");
// middleware
app.use(cors());
app.use(express.json());


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
        await client.connect();


        // data collection  
        const serviceCollection = client.db('RoyalDB').collection('services');
        const bookingsCollection = client.db('RoyalDB').collection('bookings');

        //data created


        // })
        //data read 
        // app.get('/cars', async (req, res) => {
        //     const cursor = carsCollection.find();
        //     const result = await cursor.toArray();
        //     res.send(result);
        // })


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
            //http://localhost:5000/services?category=categoryValue
            //http://localhost:5000/services?sortFeild=price&priceOrder=asc

        })
        app.get('/services', async (req, res) => {
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

        app.get('/bookings', async (req, res) => {
            try {
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
        // app.put('/cars/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) }
        //     const options = { upsert: true };
        //     const updatedCar = req.body;
        //     const cars = {
        //         $set: {
        //             name: updatedCar.name,
        //             brand: updatedCar.brand,
        //             type: updatedCar.type,
        //             price: updatedCar.price,
        //             details: updatedCar.details,
        //             photo: updatedCar.photo

        //         }
        //     }
        //     const result = await carsCollection.updateOne(filter,cars ,options)
        //     res.send(result);
        // })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
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

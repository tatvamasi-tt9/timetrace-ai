require('dotenv').config();

const express = require('express');
const cors = require('cors'); 
const PORT=process.env.PORT;
const app = express();
app.use(cors());                          //  Allows React (port 3000) to talk to Node (port 3001)
app.use(express.json());
require('./Models/db');

const Searchrouter=require('./Routes/Searchrouter')


// pata nahi , pata nahi , pata nahi , main  rahu na rahu , is duniya me tb tk , ae priya tamein , patra yeh mera , tumhe milega  jb tk , pata nahi , pata nahi , pata nahi , mein rahoon na rahoon is duniya mein tab tak , ae priya tamein

//  main search route
app.use('/api', Searchrouter);



app.listen(PORT, () => console.log(`API Server running on port ${PORT}`));


import { connectDB } from './db/index.js';
import { app } from './app.js';


connectDB()
    .then(() => {
        app.on('error', (error) => {
            console.log(`error, ${error}`);
            throw error;
        });

        app.listen(process.env.PORT, () => {
            console.log(`server is running at port ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.log('mongodb connection failed', error);
    });

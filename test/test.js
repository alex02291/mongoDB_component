const express = require('express');


const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.post('/', async (req, res) => {
    try {
        var MongoClient  = require('mongodb').MongoClient;
        const {url, crud, database, col} = req.body[0];
       
        //var url = 'mongodb://'+user+':'+password+'@'+host+':'+port+'/?poolSize=20&writeConcern=majority';
        //var url = 'mongodb+srv://admin:seisdelta@6dcluster0.ei1vj.mongodb.net/test'
        //let snapshot = {};
    
        //snapshot.lastUpdated = snapshot.lastUpdated || new Date();

     

            
        if(crud == "find"){
            MongoClient.connect(url, (err, con) => {
            // si hay error finalizar
            if(err){
                console.log(`No se puede conectar al servidor de mongo ${url}`);
                process.exit(1);
            }
            // si no hay error consultar los estudiantes con el id prorpocionado
            con.db(database).collection(col)
                .find().toArray((err, docs) => {
                    // si hay error entonces finalizar
                    if(err){
                        console.log(`Error al momento de realizar la consulta`);
                        process.exit(1);
                    }
                    // mostrar los registros
                    console.log(docs);
                    console.log('docs');
                    res.json(docs);
                   //process.exit(0);
                })
            });
        }else if(crud == "insert"){
            var datosCol = req.body[1];
            MongoClient.connect(url, (err, con) => {
            // si hay error finalizar
            if(err){
                console.log(`No se puede conectar al servidor de mongo ${url}`);
                process.exit(1);
            }
                con.db(database).collection(col).insertOne(datosCol);
                res.json("Se insertó el registro correctamente.");
            });
        }else if(crud == "update"){
            var dataUpdate = req.body[1];
            var filter = dataUpdate[0];
            var data  = dataUpdate[1]
            MongoClient.connect(url, (err, con) => {
            // si hay error finalizar
            if(err){
                console.log(`No se puede conectar al servidor de mongo ${url}`);
                process.exit(1);
            }
                con.db(database).collection(col).updateOne(
                    filter, 
                    {
                    $set: data
                    });
                res.json("Se actualizó el registro correctamente.");
            });
        }else if(crud == "delete"){
            var dataDelete = req.body[1];
            console.log(dataDelete);
            MongoClient.connect(url, (err, con) => {
            // si hay error finalizar
            if(err){
                console.log(`No se puede conectar al servidor de mongo ${url}`);
                process.exit(1);
            }
                con.db(database).collection(col).deleteOne(
                    dataDelete
                    );
                res.json("Se eliminó el registro correctamente.");
            });
        }

        

    } catch (e) {
        console.log(e);
        //await rabbitmq.producerMessage(e);
        res.status(500).json(e);
    }
});


app.listen(PORT, () => console.log('Service up in port', PORT))

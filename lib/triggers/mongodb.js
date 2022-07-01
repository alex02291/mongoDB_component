const express = require('express');
const log = require('../../helpers/logger');
const rabbitmq = require('../../helpers/rabbit');


module.exports.process = async function processTrigger(msg, cfg, snapshot = {}){
    try {
        log.info("Inside processTrigger()");
        log.info("Config=" + JSON.stringify(cfg));

        var MongoClient  = require('mongodb').MongoClient;
        let {url, crud, database, col} = cfg[0];
            
        if(crud == "find"){
            MongoClient.connect(url, (err, con) => {
            // si hay error finalizar
            if(err){
                log.info("Can't connect to mongo server" + url);
                process.exit(1);
            }
            // si no hay error consultar los estudiantes con el id prorpocionado
            con.db(database).collection(col)
                .find().toArray((err, docs) => {
                    // si hay error entonces finalizar
                    if(err){
                        log.info("Error when making the query");
                        process.exit(1);
                    }
                    // mostrar los registros
                    this.emit('data',{data:docs});
                    log.info('data', docs);
                })
            });
        }else if(crud == "insert"){
            var datosCol = cfg[1];
            MongoClient.connect(url, (err, con) => {
            // si hay error finalizar
            if(err){
                console.log("Can't connect to mongo server" + url);
                process.exit(1);
            }
                con.db(database).collection(col).insertOne(datosCol);
                this.emit('data',{data:"Record inserted successfully."} );
                log.info('data', "Record inserted successfully.");
            });
        }else if(crud == "update"){
            var dataUpdate = cfg[1];
            var filter = dataUpdate[0];
            var data  = dataUpdate[1]
            MongoClient.connect(url, (err, con) => {
            // si hay error finalizar
            if(err){
                log.info("Can't connect to mongo server" + url);
                process.exit(1);
            }
                con.db(database).collection(col).updateOne(
                    filter, 
                    {
                    $set: data
                    });
                
                this.emit('data',{data:"Registry updated successfully."} );
                log.info('data', "Registry updated successfully.");
            });
        }else if(crud == "delete"){
            var dataDelete = cfg[1];
            console.log(dataDelete);
            MongoClient.connect(url, (err, con) => {
            // si hay error finalizar
            if(err){
                log.info("NCan't connect to mongo server"+ url);
                process.exit(1);
            }
                con.db(database).collection(col).deleteOne(
                    dataDelete
                    );
                this.emit('data',{data:"Record deleted successfully."} );
                log.info('data', "Record deleted successfully.");
            });
        }

        

    } catch (e) {
        log.error(`ERROR: ${e}`);
        this.emit('error', e);
        await rabbitmq.producerMessage(e);
    }
};




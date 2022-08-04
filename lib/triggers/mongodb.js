const express = require('express');
const MongoClient  = require('mongodb').MongoClient;
const log = require('../../helpers/logger');
const rabbitmq = require('rabbitmqcg-nxg-oih');
const ERROR_PROPERTY = 'Error missing property';

module.exports.process = async function processTrigger(msg, cfg, snapshot = {}){
    try {
        log.info("Inside processTrigger()");
        log.info("Msg=" + JSON.stringify(msg));
        log.info("Config=" + JSON.stringify(cfg));
        log.info("Snapshot=" + JSON.stringify(snapshot));

        let {data} = msg;

        let properties={
            url:null,
            crud:null,
            database:null,
            col:null,
            dataInsert:null
        };
        
        if (!data) {
            this.emit('error', `${ERROR_PROPERTY} data`);
            throw new Error(`${ERROR_PROPERTY} data`);
        }

        Object.keys(properties).forEach((value) => {
            if (data.hasOwnProperty(value)) {
                properties[value] = data[value];
            } else if (cfg.hasOwnProperty(value)) {
                properties[value] = cfg[value];
            } else {
                log.error(`${ERROR_PROPERTY} ${value}`);
                throw new Error(`${ERROR_PROPERTY} ${value}`);
            }
        });
            
        if(properties.crud == "find"){
            MongoClient.connect(properties.url, (err, con) => {
            // si hay error finalizar
            if(err){
                log.info("Can't connect to mongo server" + properties.url);
                process.exit(1);
            }
            // si no hay error consultar los estudiantes con el id prorpocionado
            con.db(properties.database).collection(properties.col)
                .find().toArray((err, docs) => {
                    // si hay error entonces finalizar
                    if(err){
                        log.info("Error when making the query");
                        process.exit(1);
                    }
                    // mostrar los registros
                    var buff = new Buffer.from(JSON.stringify(docs)).toString("base64");
                    snapshot.lastUpdated = new Date();
                    log.info(`New snapshot: ${snapshot.lastUpdated}`);
                    this.emit('snapshot', snapshot);
                    this.emit('data',{data:{content:buff}});
                    log.info('data', buff);
                })
            });
        }else if(properties.crud == "insert"){
            var datosCol = properties.dataInsert;
            if(datosCol.length > 1){
                const client = new MongoClient(properties.url);
                const dBase = client.db(properties.database);
                const coll = dBase.collection(properties.col);
                const options = { ordered: true };
                const result = await coll.insertMany(datosCol, options);

                snapshot.lastUpdated = new Date();
                log.info(`New snapshot: ${snapshot.lastUpdated}`);
                this.emit('snapshot', snapshot);
                this.emit('data',{data:`${datosCol.length} documents were inserted.`} );
                log.info('data', `${datosCol.length} documents were inserted.`);
            }else{
                MongoClient.connect(properties.url, (err, con) => {
                    // si hay error finalizar
                    if(err){
                        console.log("Can't connect to mongo server" + properties.url);
                        process.exit(1);
                    }
                    con.db(database).collection(col).insertOne(datosCol);
                    snapshot.lastUpdated = new Date();
                    log.info(`New snapshot: ${snapshot.lastUpdated}`);
                    this.emit('snapshot', snapshot);
                    this.emit('data',{data:"Record inserted successfully."} );
                    log.info('data', "Record inserted successfully.");
                });
            }
        }else if(properties.crud == "update"){
            var dataUpdate = properties.dataInsert;
            var filter = dataUpdate[0];
            var dataUpd  = dataUpdate[1]
            MongoClient.connect(properties.url, (err, con) => {
            // si hay error finalizar
            if(err){
                log.info("Can't connect to mongo server" + properties.url);
                process.exit(1);
            }
                con.db(properties.database).collection(properties.col).updateOne(
                    filter, 
                    {
                    $set: dataUpd
                    });

                snapshot.lastUpdated = new Date();
                log.info(`New snapshot: ${snapshot.lastUpdated}`);
                this.emit('snapshot', snapshot);
                this.emit('data',{data:"Registry updated successfully."} );
                log.info('data', "Registry updated successfully.");
            });
        }else if(properties.crud == "delete"){
            var dataDelete = properties.dataInsert;
            console.log(dataDelete);
            MongoClient.connect(properties.url, (err, con) => {
            // si hay error finalizar
            if(err){
                log.info("NCan't connect to mongo server"+ properties.url);
                process.exit(1);
            }
                con.db(properties.database).collection(properties.col).deleteOne(
                    dataDelete
                    );
                snapshot.lastUpdated = new Date();
                log.info(`New snapshot: ${snapshot.lastUpdated}`);
                this.emit('snapshot', snapshot);
                this.emit('data',{data:"Record deleted successfully."} );
                log.info('data', "Record deleted successfully.");
            });
        }

        

    } catch (e) {
        log.error(`ERROR: ${e}`);
        this.emit('error', e);
        await rabbitmq.producerErrorMessage(msg.toString(), e.toString());
    }
};




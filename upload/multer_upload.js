// initializing logger to write logs in file
var logger = require('../app/logs/logger');     // logger code

// this file is being used for getting the posted files from the Python client
module.exports=function(app,multer){
    app.use(multer({ dest: './files/',
        rename: function (fieldname, filename) {
        return filename+Date.now();
    },
    onFileUploadStart: function (file) {
        logger.info(file.originalname + ' is starting to upload...');
        var renamed_file_name=
        logger.info('Renaming the file from '+file.originalname + ' to ' );
    },
    onFileUploadComplete: function (file) {
        console.log(file.fieldname + ' uploaded to  ' + file.path)
        done=true;
    }
}));
};


//==============================================
//=================End of the code==============
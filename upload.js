const fs = require('fs');
const path = require('path');

const uploadSingleFile = async (fileName, filePath, drive) => {
  // const folderId = "15YECFhzN0MoqVasqlGefW8qITYFgiCtk";
  const { data: { id, name } = {} } = await drive.files.create({
    resource: {
      name: fileName,
      // parents: [folderId],
    },
    media: {
      mimeType: 'audio/mpeg',
      body: fs.createReadStream(filePath),
    },
    fields: 'id,name',
  });
  if (id) {
    console.log('File Uploaded', name, id);
    return true;
  } else {
    return false;
  }
};

const scanFolderForFiles = async (folderPath) => {
  const folder = await fs.promises.opendir(folderPath);
  //   console.log("folder:  ", folder);
  for await (const dirent of folder) {
    console.log('\ndirent:   ', dirent);
    if (dirent.isFile() && dirent.name.endsWith('.mp3')) {
      await uploadSingleFile(dirent.name, path.join(folderPath, dirent.name));
      await fs.promises.rm(filePath);
    }
  }
};

module.exports = {
  scanFolderForFiles: scanFolderForFiles,
  uploadSingleFile: uploadSingleFile,
};

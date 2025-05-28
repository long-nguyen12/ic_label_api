import path from'path'

export default {
  findFileById(req, res) {
    let {id} = req.params;
    return res.sendFile(path.join(process.cwd(), './uploads/files/' + id));
  }
};

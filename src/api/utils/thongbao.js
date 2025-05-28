


function is_phonenumber(phonenumber) {
  phonenumber = phonenumber.toString();
  var phoneno = /^\+?([0-9]{2})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{4})$/;
  if (phonenumber.match(phoneno)) {
    return true;
  } else {
    return false;
  }
}

export async function xacthucdienthoaifunc(benhnhan) {
  try {
    await BenhNhan.updateMany({dienthoai: benhnhan.dienthoai, _id: {$ne: benhnhan._id}}, {xacthucdienthoai: false})
  } catch (e) {
    console.log(e)
  }
}

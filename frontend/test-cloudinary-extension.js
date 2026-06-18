const url = "https://res.cloudinary.com/demo/video/upload/v1234/dog.mp4";
const transformations = "f_webp,fl_awebp,q_auto,c_fill,w_400,h_400";
const urlAsWebp = url.replace(/\.(mp4|mov|webm)$/i, '.webp');
const parts = urlAsWebp.split('/upload/');
console.log(`${parts[0]}/upload/${transformations}/${parts[1]}`);

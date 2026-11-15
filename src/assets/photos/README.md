# Local product photos

Product photos normally load from Pexels and Unsplash. Any photo that exists in this folder is used instead, so the
demo also works without an internet connection.

Fill the folder once, on a computer with internet access:

```bash
npm run photos:download
```

Each photo is saved in two widths, 320 px for thumbnails and cards and 800 px for the product gallery
(`pexels-<id>-320.jpg`, `pexels-<id>-800.jpg`, `unsplash-<id>-…`). Photos that are missing here keep loading from the
internet, and fall back to the category icon if that fails.

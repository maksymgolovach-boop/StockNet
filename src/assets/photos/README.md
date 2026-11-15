# Local product photos

Product photos normally load from Pexels and Unsplash. Any photo that exists in this folder is used instead, so the
demo also works without an internet connection.

Fill the folder once, on a computer with internet access:

```bash
npm run photos:download
```

File names are derived from the photo's address (`pexels-<id>.jpg`, `unsplash-<id>.jpg`). Photos that are missing here
keep loading from the internet, and fall back to the category icon if that fails.

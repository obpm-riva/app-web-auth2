# app-web-iam

Pryv.io web pages for user registration, authentication & password reset.

## Usage

TODO: how to link your platform to it.

## Contribute

*Prerequisites*: NodeJS v8+, Yarn v0.27+

Run `yarn setup` to install the dependencies and create the `dist/` folder to publish on gh-pages.

Run `yarn grunt` to generate the web pages to `dist/v2`.

Run `yarn webserver`, then open [https://pryv.github.io/app-web-access/?pryv-reg=reg.pryv.me](https://pryv.github.io/app-web-access/?pryv-reg=reg.pryv.me) (replace `pryv.me` if you are working on another platform), click on `Show/hide advanced options` then select `Run on local web-auth (port 4443)`, this will force to use the pages hosted by the local server.

Once you are happy with the result, run `yarn upload COMMIT_MESSAGE`.

Run `yarn clear` to delete the `dist/`, this will require to run `yarn setup` for tasks requiring `dist/`.

## License

[Revised BSD license](https://github.com/pryv/documents/blob/master/license-bsd-revised.md)

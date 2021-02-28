# Send pdfs to multiple users script

## Development

**[DISCLAIMER]** This script was tossed together and I don't know if this runs on any other config then
mine! You are happy to try and create an issue/PR with dev fixes. I kinda piggy backed on a lot of
my global linters/prettier/configs. I tried adding most of it into the `package.json` in order
for others to run it.

```sh
$ yarn
$ tsc --watch
```

## Production

```sh
# Get deps and build .js from .ts
$ yarn
$ yarn build
```

### Get the files you need

This is specific for the actual use-case of the program. From **gogift** half then job is getting the
pdfs downloaded from their `.csv`. This is not integrated in the program, but can be done with some
quick `shell` commands.

```sh
# The link to the pdf is the last column in each row, so we awk that and wget each link into ./pdfs
$ cat gogift.csv | awk -F "\"*;\"*" '{print $NF}' | wget --no-check-certificate -E -H -k -K -p -e robots=off -Ppdfs -nH --cut-dirs=3 -i -

# The files have no .pdf ending and have a long name so we can rename them
$ counter=0; for file in pdfs/*; do [[ -f $file ]] && mv -i "$file" $((counter+1)).pdf && ((counter++)); done
```

The steps above will result in a folder called `pdfs` with all the pfds in them, named `n.pdf`

## Run

`yarn start` takes the following args/flags.

| Argument       | Flag | Value                                              |
| -------------- | ---- | -------------------------------------------------- |
| `--from`       | `-F` | Name of the sender/org                             |
| `--ooccation`  | `-O` | Reason/Event for sending                           |
| `--from_email` | `-E` | Mail of the sender (Has to be in the bedkom group) |
| `--pdfs`       | `-P` | Path to folder with pdfs                           |

## Check parsing and continue

The script will simply **merge/fold/zip** one email with one pdf.

1. If `emails > pfds` it will throw an error
2. If `emails < pdfs` it will simple not use the rest of the pdfs

## Example

When starting the script it will will show the targets and ask for `Y` or `yes` to continue.

```sh
❯ yarn start \
--from OnlineLinjeforening \
--occation Generalforsamling \
--from_email eks@online.ntnu.no \
(Has to be an email that is in the bedkom g-suite group)
--pdfs input/pdfs \

yarn run v1.22.10
$ node build/index.js --from OnlineLinjeforening --occation Generalforsamling --from_email eks@online.ntnu.no --pdfs input/pdfs

=============================================
Finished parsing mails and pdfs
=============================================
Assigned pdfs as follows [
  { email: 'anders@gmail.com', path: '1.pdf' },
  { email: 'martin@gmail.no', path: '2.pdf' },
  { email: 'petter@gmail.com', path: '3.pdf' }
]
prompt: continue:
```

Here you can see that everything is working as intended, and can track what email got what pdf.

```sh
=============================================
Next target: 	 anders@gmail.com
Using file: 	 1.pdf
Email sent: 	 250 2.0.0 OK  1613814584 x36sm1196276lfu.129 - gsmtp
Envelope: 	 { from: 'eks@online.ntnu.no', to: [ 'anders@gmail.com' ] }
Accepted: 	 [ 'anders@gmail.com' ]
=============================================
Next target: 	 martin@gmail.no
Using file: 	 2.pdf
Email sent: 	 250 2.0.0 OK  1613814586 e5sm1248442ljj.71 - gsmtp
Envelope: 	 { from: 'eks@online.ntnu.no', to: [ 'martin@gmail.no' ] }
Accepted: 	 [ 'martin@gmail.no' ]
=============================================
Next target: 	 petter@gmail.com
Using file: 	 3.pdf
Email sent: 	 250 2.0.0 OK  1613814587 t14sm1249475ljc.70 - gsmtp
Envelope: 	 { from: 'eks@online.ntnu.no', to: [ 'petter@gmail.com' ] }
Accepted: 	 [ 'petter@gmail.com' ]
✨  Done
```

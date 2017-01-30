#! /bin/bash

set -e

NEWTONSOFT_JSON_PATH=~/t/nj/Bin/Net45

SET=$(echo "$1" | sed -e 's/\.cshtml$//')

export MONO_PATH="$NEWTONSOFT_JSON_PATH"

./cshtml2cs.pl "$SET".cshtml > "$SET".cs
mcs -out:"$SET" \
		"$SET".cs \
		../../ViewModels/Set.cs \
		../../ViewModels/Update.cs \
		-reference:"$NEWTONSOFT_JSON_PATH"/Newtonsoft.Json.dll

./"$SET" > ../../wwwroot/"$SET"/set.json

rm "$SET" "$SET.cs"

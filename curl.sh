curl -X POST "http://localhost/final.php/openaiproxy" \
-d "endpoint=responses" \
--data-urlencode "payload={
\"model\": \"gpt-5\",
\"input\": \"Say hello from the PHP REST proxy!\"
}"

curl -X POST 'http://114.215.204.62/v1/workflows/run' \
--header 'Authorization: Bearer app-xBO6kaetqL7HF0avy1cSZMTR' \
--header 'Content-Type: application/json' \
--data-raw '{
    "inputs": {
        "TagImage": [
            {
                "type": "image",
                "transfer_method": "remote_url",
                "url": "https://26867860.s21i.faiusr.com/2/ABUIABACGAAg4oLkhwYo6PjfngcwlgY41wo.jpg"
            }
        ],
        "Foodtype": "糕点",
        "PackageFoodType": "直接提供给消费者的预包装食品",
        "SingleOrMulti": "多件",
        "PackageSize": "最大表面面积大于35cm2"
    },
    "response_mode": "blocking",
    "user": "user-12345"
}'
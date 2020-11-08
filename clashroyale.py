import urllib.request
import json

"""with open("token.txt") as f:
  my_key = f.read().rstrip("\n")
  base_url = "https://api.clashroyale.com/v1"
  endpoint = "/cards"

  request = urllib.request.Request(
    base_url+endpoint, 
    None,
    {
      "Authorization": "Bearer " + my_key
    }
  )

  response = urllib.request.urlopen(request).read().decode("utf-8")
  print(response)"""

request = urllib.request.Request(
  "https://api.clashroyale.com/v1/players/%25YQUC8ULVL", 
  None,
  {
    "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImRiNjM2NzZkLWUwZjUtNGJkNy1hZTlkLTQ4YzYwZmYzZmEwMiIsImlhdCI6MTYwNDU0MDg1Mywic3ViIjoiZGV2ZWxvcGVyLzZmMDliMjM1LWViMDUtMzhjOS04ZTEyLTMxYjViMjJkM2VkNCIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyIxODQuMTcwLjE2Ni4xNzciXSwidHlwZSI6ImNsaWVudCJ9XX0.--1G_piVVajh6AR4S_DU2mu7TrIQ7HKx7kf9xLpiWUTjuruJNDMeKv3NAJb4q-cWiRniVKdyKzliEWjSYn2-jA"
  }
)

response = urllib.request.urlopen(request).read().decode("utf-8")
print(response)




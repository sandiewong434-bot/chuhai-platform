import httpx

resp = httpx.post('http://localhost:8000/api/v1/score/country', json={
    'country_code': 'TH',
    'industry': 'NEV'
})
print(resp.status_code)
print(resp.json())

import express from 'express'
const app = express()

const PORT = 4000
const hostname = 'localhost'
app.get('/', (req, res) => {
  res.send('Success')
})
const myName: string = 'dat'
app.listen(PORT, hostname, () => {
  console.log(`Server running at http://${hostname}:${PORT}/`)
})

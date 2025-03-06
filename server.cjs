const jsonServer = require('json-server')

const server = jsonServer.create()
const router = jsonServer.router('src/db/index.json')
const middlewares = jsonServer.defaults()

server.use(middlewares)

server.use(jsonServer.bodyParser)

server.post('/tasks', (req, res, next) => {
  const projectId = req.body.projectId
  console.log('+', projectId)

  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' })
  }

  const project = router.db.get('projects').find({ id: projectId }).value()
  if (!project) {
    return res.status(404).json({ error: 'Project not found' })
  }

  next()

  res.on('finish', () => {
    if (res.statusCode === 201) {
      const currentTaskCount = router.db.get('tasks').filter({ projectId }).value().length
      router.db
        .get('projects')
        .find({ id: projectId })
        .assign({ taskCount: currentTaskCount })
        .write()
      console.log('taskCount после добавления:', currentTaskCount)
    }
  })
})

server.delete('/tasks/:id', (req, res, next) => {
  const taskId = req.params.id
  const task = router.db.get('tasks').find({ id: taskId }).value()

  if (!task) {
    return res.status(404).json({ error: 'Task not found' })
  }

  const projectId = task.projectId

  if (!projectId) {
    return next()
  }

  const project = router.db.get('projects').find({ id: projectId }).value()
  if (!project) {
    return res.status(404).json({ error: 'Project not found' })
  }

  next()

  res.on('finish', () => {
    if (res.statusCode === 200) {
      const currentTaskCount = router.db.get('tasks').filter({ projectId }).value().length
      router.db
        .get('projects')
        .find({ id: projectId })
        .assign({ taskCount: currentTaskCount })
        .write()
      console.log('taskCount после удаления:', currentTaskCount)
    }
  })
})

server.use(router)

server.listen(3000, () => {
  console.log('JSON Server is running on port 3000')
})

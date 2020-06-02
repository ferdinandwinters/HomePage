import React, { useState, useEffect } from 'react'
import { BlockWrapper } from '../../helpers/BlockWrapper'
import { Todoist } from './Todoist'
import { todoistKeyState, todoistCounterState } from '../../state/atoms'
import { useRecoilState } from 'recoil'
import { getDayAndMonth, getCurrentDate } from '../../helpers/date'
import axios from 'axios'

export interface ProjectInterface {
  id: number
  title: string
  ind?: number
}

export interface TaskInterface {
  id: number
  projectId: number
  order: number
  text: string
  dueDate: string
  dueDateString: string
}

const TodoistContainer: React.FC = () => {
  const [todoistKey] = useRecoilState(todoistKeyState)
  const [tasksLoading, setTasksLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tasks, setTasks] = useState<[] | TaskInterface[]>([])
  const [projects, setProjects] = useState<[] | ProjectInterface[]>([])
  const [todoistTaskCount, setTodoistTaskCount] = useRecoilState(
    todoistCounterState
  )

  const fetchProjects = () => {
    setLoading(true)
    const url = `/api/todoist/projects/${todoistKey}`
    axios
      .get(url)
      .then(res => {
        const allProjects: ProjectInterface[] = []
        let i = 0
        res.data.forEach((proj: any) => {
          let project = {
            id: proj.id,
            title: proj.name,
            ind: i
          }
          i++
          allProjects.push(project)
        })
        setProjects(allProjects)
        setLoading(false)
        setError('')
      })
      .catch(err => {
        setError('There was an error fetching Todoist projects')
        setLoading(false)
      })
  }

  const fetchTasks = () => {
    setTasksLoading(true)
    const url = `/api/todoist/tasks/${todoistKey}`
    axios
      .get(url)
      .then(res => {
        const allTasks: TaskInterface[] = []
        res.data.forEach((item: any) => {
          let task = {
            id: item.id,
            projectId: item.project_id,
            order: item.order,
            text: item.content,
            dueDate: item.due ? item.due.date : '',
            dueDateString: item.due ? getDayAndMonth(item.due.date) : ''
          }
          allTasks.push(task)
        })
        setTasks(allTasks)
        setTasksLoading(false)
        setError('')
      })
      .catch(err => {
        setError('There was an error fetching Todoist tasks')
        setTasksLoading(false)
      })
  }

  const completeTask = (taskId: number) => {
    if (
      window.confirm('Are you sure you want to mark this task as completed?')
    ) {
      const url = `/api/todoist/tasks/close/${taskId}/${todoistKey}`
      axios
        .post(url, {}, { headers: { Authorization: `Bearer ${todoistKey}` } })
        .then(res => {
          fetchTasks()
        })
        .catch(err => {
          setError('There was an error completing this task')
        })
    }
  }

  const createTask = (text: string, date: string, project: number) => {
    const url = `/api/todoist/tasks/${todoistKey}`
    axios
      .post(url, {
        content: text,
        due_date: date,
        project_id: project
      })
      .then(res => {
        fetchTasks()
      })
      .catch(err => {
        setError('There was an error adding this task')
      })
  }

  useEffect(() => {
    if (todoistKey) {
      fetchProjects()
      fetchTasks()
    } else {
      setError('You need to set your Todoist key on the settings')
    }
  }, [todoistKey])

  useEffect(() => {
    const count = tasks.filter(task => getCurrentDate() === task.dueDate).length
    setTodoistTaskCount(count)
  }, [tasks])

  return (
    <BlockWrapper
      isLoading={loading}
      hasError={Boolean(error)}
      error={error}
      name="Todoist"
    >
      <Todoist
        tasks={tasks}
        projects={projects}
        completeTask={completeTask}
        createTask={createTask}
        tasksLoading={tasksLoading}
      />
    </BlockWrapper>
  )
}

export default TodoistContainer
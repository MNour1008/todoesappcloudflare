"use client";
    import { useState, useEffect } from 'react';
    import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
    import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

    function TaskCard({ task, index, onDelete, onEdit, onClick }) {
      return (
        <Draggable draggableId={String(task.id)} index={index}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className="bg-white rounded-lg shadow p-4 cursor-pointer"
              onClick={() => onClick(task)}
            >
              <div className="flex items-center mb-2">
                {task.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 mr-1">
                    <span className="h-2 w-2 mr-1 rounded-full bg-green-500 inline-block"></span>
                    {tag}
                  </span>
                ))}
                <div className="ml-auto flex">
                  <button onClick={() => onEdit(task)} className="text-gray-500 hover:text-gray-700 mr-2">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(task.id)} className="text-gray-500 hover:text-gray-700">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{task.description}</p>
            </div>
          )}
        </Draggable>
      );
    }

    function TaskColumn({ title, tasks, setTasks, searchTerm, onDelete, onEdit, onClick }) {
      const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return (
        <div className="w-full md:w-1/2 lg:w-1/4 px-2 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              {title}
              <span className="ml-2 bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">{filteredTasks.length}</span>
            </h2>
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </button>
          </div>
          <Droppable droppableId={title}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {filteredTasks.map((task, index) => (
                  <TaskCard key={task.id} task={task} index={index} onDelete={onDelete} onEdit={onEdit} onClick={onClick} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      );
    }

    export default function Home() {
      const [tasks, setTasks] = useState({
        'To Do': [],
        'Doing': [],
        'Done': [],
      });
      const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        tags: '',
        status: 'To Do',
      });
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [searchTerm, setSearchTerm] = useState('');
      const [isEditModalOpen, setIsEditModalOpen] = useState(false);
      const [editTask, setEditTask] = useState({
        id: null,
        title: '',
        description: '',
        tags: '',
        status: 'To Do',
      });
      const [selectedTask, setSelectedTask] = useState(null);
      const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

      useEffect(() => {
        const fetchTasks = async () => {
          const response = await fetch('/api/tasks');
          if (response.ok) {
            const data = await response.json();
            setTasks(data);
          }
        };
        fetchTasks();
      }, []);

      const handleInputChange = (e) => {
        setNewTask({ ...newTask, [e.target.name]: e.target.value });
      };

      const handleAddTask = async (e) => {
        e.preventDefault();
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newTask),
        });

        if (response.ok) {
          const addedTask = await response.json();
          setTasks(prevTasks => ({
            ...prevTasks,
            [newTask.status]: [...prevTasks[newTask.status], addedTask],
          }));
          setNewTask({ title: '', description: '', tags: '', status: 'To Do' });
          setIsModalOpen(false);
        }
      };

      const onDragEnd = async (result) => {
        if (!result.destination) {
          return;
        }

        const { source, destination, draggableId } = result;
        const taskId = parseInt(draggableId);
        const sourceStatus = source.droppableId;
        const destinationStatus = destination.droppableId;

        if (sourceStatus === destinationStatus) {
          return;
        }

        const response = await fetch('/api/tasks', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId, sourceStatus, destinationStatus }),
        });

        if (response.ok) {
          const updatedTasks = await response.json();
          setTasks(updatedTasks);
        }
      };

      const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
      };

      const handleDeleteTask = async (taskId) => {
        const response = await fetch('/api/tasks', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId }),
        });

        if (response.ok) {
          const updatedTasks = await response.json();
           setTasks(updatedTasks);
        }
      };

      const handleEditTask = (task) => {
        setEditTask({
          id: task.id,
          title: task.title,
          description: task.description,
          tags: task.tags.join(', '),
          status: task.status,
        });
        setIsEditModalOpen(true);
      };

      const handleEditInputChange = (e) => {
        setEditTask({ ...editTask, [e.target.name]: e.target.value });
      };

      const handleUpdateTask = async (e) => {
        e.preventDefault();
        const response = await fetch('/api/tasks', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId: editTask.id,
            updatedTask: {
              title: editTask.title,
              description: editTask.description,
              tags: editTask.tags.split(',').map(tag => tag.trim()),
            },
          }),
        });

        if (response.ok) {
          const updatedTasks = await response.json();
          setTasks(updatedTasks);
          setIsEditModalOpen(false);
        }
      };

      const handleTaskClick = (task) => {
        setSelectedTask(task);
        setIsDetailModalOpen(true);
      };

      const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedTask(null);
      };

      return (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="container mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 mr-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search any task"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center">
                <PlusIcon className="h-4 w-4 mr-1" />
                Add task
              </button>
            </div>
            <div className="flex flex-wrap -mx-2">
              <TaskColumn
                title="To Do"
                tasks={tasks['To Do']}
                setTasks={setTasks}
                searchTerm={searchTerm}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onClick={handleTaskClick}
              />
              <TaskColumn
                title="Doing"
                tasks={tasks['Doing']}
                setTasks={setTasks}
                searchTerm={searchTerm}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onClick={handleTaskClick}
              />
              <TaskColumn
                title="Done"
                tasks={tasks['Done']}
                setTasks={setTasks}
                searchTerm={searchTerm}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onClick={handleTaskClick}
              />
            </div>

            {isModalOpen && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
                <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                  <h2 className="text-2xl font-bold mb-4">Add New Task</h2>
                  <form onSubmit={handleAddTask}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">Title</label>
                      <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="title" type="text" name="title" value={newTask.title} onChange={handleInputChange} required />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">Description</label>
                      <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="description" name="description" value={newTask.description} onChange={handleInputChange} required />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tags">Tags (comma separated)</label>
                      <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="tags" type="text" name="tags" value={newTask.tags} onChange={handleInputChange} />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">Status</label>
                      <select className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="status" name="status" value={newTask.status} onChange={handleInputChange}>
                        <option value="To Do">To Do</option>
                        <option value="Doing">Doing</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded mr-2">Cancel</button>
                      <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Add Task</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isEditModalOpen && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
                <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                  <h2 className="text-2xl font-bold mb-4">Edit Task</h2>
                  <form onSubmit={handleUpdateTask}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">Title</label>
                      <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="title" type="text" name="title" value={editTask.title} onChange={handleEditInputChange} required />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">Description</label>
                      <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="description" name="description" value={editTask.description} onChange={handleEditInputChange} required />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tags">Tags (comma separated)</label>
                      <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="tags" type="text" name="tags" value={editTask.tags} onChange={handleEditInputChange} />
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded mr-2">Cancel</button>
                      <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Update Task</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isDetailModalOpen && selectedTask && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
                <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
                    <button onClick={handleCloseDetailModal} className="text-gray-500 hover:text-gray-700">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <p className="text-gray-700 mb-4">{selectedTask.description}</p>
                  <div className="flex items-center mb-2">
                    {selectedTask.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 mr-1">
                        <span className="h-2 w-2 mr-1 rounded-full bg-green-500 inline-block"></span>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DragDropContext>
      );
    }

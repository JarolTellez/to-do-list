document.getElementById('agregar_tarea').addEventListener('click', function() {
    const taskTemplate = document.getElementById('template_tarea').content;
    const newTask = document.importNode(taskTemplate, true);
    document.getElementById('lista_tareas').appendChild(newTask);
});

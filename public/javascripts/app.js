import { handleErrors } from "./utils.js";
import { fetchTask, fetchComments, postComment } from "./task-comments.js";

// fetch user's incomplete tasks

export const fetchTasks = async () => {
    const res = await fetch("/tasks/incomplete")

    if (res.status === 401) {
        window.location.href = "/log-in";
        return;
      }

    const { tasks, user } = await res.json();

    const tasksListContainer = document.querySelector(".task-list");
    const tasksHtml = tasks.map(({ id, description }) => `
    <div class="task-info">
        <input type="checkbox" class="task-check-box" id=${id} name=${id}>
        <label for=${id} id=${id} class="task-check-box">${description}</label>
    </div>
    `)

    tasksListContainer.innerHTML = tasksHtml.join("");
}

// fetch user's completed tasks

const fetchCompletedTasks = async () => {
  const res = await fetch("/tasks/complete")

  if (res.status === 401) {
      window.location.href = "/log-in";
      return;
    }

  const { tasks, user } = await res.json();

  const tasksListContainer = document.querySelector(".task-list");
  const tasksHtml = tasks.map(({ id, description }) => `
  <div class="task-info">
      <input type="checkbox" class="task-check-box" id=${id} name=${id}>
      <label for=${id} id=${id} class="task-check-box">${description}</label>
  </div>
  `)

  tasksListContainer.innerHTML = tasksHtml.join("");
}

// toggle between incomplete and completed tasks
// incomplete button
const incompleteTaskList = document.querySelector('#incomplete')
incompleteTaskList.addEventListener("click", async (e) => {
  await fetchTasks()
})

// completed button
const completeTaskList = document.querySelector('#complete')
completeTaskList.addEventListener("click", async (e) => {
  await fetchCompletedTasks()
})

// shows tasks that user assigns to their contacts

const fetchContactTasks = async (id) => {
  const res = await fetch(`/tasks/task/${id.id}`)
  if (res.status === 401) {
      window.location.href = "/log-in";
      return;
    }

  const { tasks } = await res.json();
  const tasksListContainer = document.querySelector(".task-list");
  const tasksHtml = tasks.map(({ id, description }) => `
  <div>
      <input type="checkbox" class="task-check-box" id=${id} name=${id}>
      <label for=${id} class="task-check-box" id=${id}>${description}</label>
  </div>
  `)

  tasksListContainer.innerHTML = tasksHtml.join("");
}

//dynamically add new contact to the sidebar
const addNewContact = async (id) => {
  const res = await fetch(`/users/${id}`, {
    method: "GET"
  })

  if (res.status === 401) {
    window.location.href = "/log-in";
    return;
  }

  const { userInfo } = await res.json();
  const addNewContact = `
  <div class="list-grid">
    <div>
        <li class="contact-list" id=${userInfo.id}>${userInfo.username}</li>
    </div>
    <div>
        <a class="delete-contact" id=${userInfo.id}>-</a>
    </div>
  </div>
  `
  const contactContainer = document.querySelector('.contact-list-sidebar');
  const node = document.createElement("div")
  node.innerHTML = addNewContact;
  contactContainer.appendChild(node);
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
      await fetchTasks();
    } catch (e) {
      console.error(e);
    }

    const tasksListContainer = document.querySelector(".task-list");
    tasksListContainer.addEventListener("click", async(e) => {
      const taskId = e.target.id;

      // let stateObj = { id: "100" }
      // window.history.replaceState(stateObj, "Task", `/tasks/#${taskId}`)

      try {
        await fetchTask(taskId);

        const createComment = document.querySelector('.create-comment');

        createComment.addEventListener('submit', async (event) => {
          event.stopPropagation();
          event.preventDefault();
          const commentData = new FormData(createComment);
          const message = commentData.get("message");
          const taskId = commentData.get("taskId");

          const body = { message };

          postComment(taskId, body);

        })

      } catch (e) {
        console.error(e);
      }

      try {
        await fetchComments(taskId);
      } catch (e) {
        console.error(e);
      }

    })

  }
  );


// create a new task
const form = document.querySelector(".create-task");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const description = formData.get("description")
    const dueDate = formData.get("dueDate")
    const checkStatus = formData.get("isCompleted")
    const givenTo = formData.get("givenTo")
    const title = formData.get("title");
    let isCompleted;

    //convert checkbox to boolean value
    if (checkStatus === 'on') {
        isCompleted = true;
    } else {
        isCompleted = false;
    }

    const body = { description, dueDate, isCompleted, givenTo, title }

    try {
        const res = await fetch("/tasks", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",

            }
        })

        if (res.status === 401) {
            window.location.href = "/log-in";
            return;
          }
        if (!res.ok) {
            throw res;
          }

        form.reset();
        await fetchTasks();
    } catch (err) {
        handleErrors(err)
    }
})

// add contacts
const addContacts = document.querySelector('.add-contacts')

addContacts.addEventListener("click", async (e) => {
  const addContactsContainer = document.querySelector('.add-contact-sidebar')
  // add contact form. checks against invalid email and existing contacts
  addContactsContainer.innerHTML = `

  <div class="form_error"></div>
  <form class="contacts-form">
  <h2>Add New Contact</h2>
      <input type="hidden" name="_csrf">
      <div class="add-contact-input">
        <div>
          <label for="email">Email Address</label>
        </div>
        <div class="add-contact-email">
          <input type="text" id="email" name="email" value="ctap105@gmail.com"/>
        </div>
      </div>
      <div>
          <button type="submit">Add Contact</button>
      </div>
      <div>
          <button class="add-contact-cancel">Cancel</button>
      </div>
  </form>
  `
  const form = document.querySelector(".contacts-form");

  const throwError = () => {
      const formError = document.querySelector(".form_error")
      formError.innerHTML = `
              <p>You entered an invalid email address, or this email is currently in your contacts.</p>
            `
}
  // create new contact
  form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const email = formData.get("email")

      const body = { email }

      try {
          const res = await fetch("/contacts", {
              method: "POST",
              body: JSON.stringify(body),
              headers: {
                  "Content-Type": "application/json",

              }
          })

          if (res.status === 401) {
              window.location.href = "/log-in";
              return;
            }
          if (!res.ok) {

              throw throwError();
            }
          const { contact } = await res.json();
          await addNewContact(contact.contactId)
          form.reset();
          addContactsContainer.innerHTML = ``;

      } catch (err) {
          handleErrors(err)
      }
  })
  // close add contact container
  const closeAddContact = document.querySelector('.add-contact-cancel')
  closeAddContact.addEventListener('click', (e) => {
    addContactsContainer.innerHTML = ``;
  })
})

// switch between your tasks and your contact's tasks
const contacts = document.querySelector('.contact-list-sidebar')

contacts.addEventListener("click", async (e) => {
  const target = e.target;
  fetchContactTasks(target)
})


// delete a contact

const deleteContact = document.querySelector('.contact-list-sidebar')

deleteContact.addEventListener("click", async (e) => {
  e.stopPropagation();
  e.preventDefault();
  if(e.target.innerText === '-'){
    const targetRemoval = e.target.parentNode.parentNode
    const deleteContactId = e.target.id;
    targetRemoval.remove();

    await fetchTasks();

    try {

      await fetch(`http://localhost:8080/contacts/${deleteContactId}`, {
        method: "DELETE",
      })



    } catch (err) {
      handleErrors(err)
    }
  }

})

// delete a list

const deleteList = document.querySelector('.list-list-sidebar')

deleteList.addEventListener("click", async (e) => {
  e.stopPropagation();
  e.preventDefault();
  const deleteListId = e.target.id;
  if (e.target.innerText === '-') {
    const targetRemoval = e.target.parentNode.parentNode
    targetRemoval.remove();
    try {

      await fetch(`http://localhost:8080/lists/${deleteListId}`, {
        method: "DELETE",
      })

    } catch (err) {
      handleErrors(err)
    }
  } else if (e.target.className === 'list-lists') {
    const listId = e.target.id;
    const listForm = document.querySelector('.updateList');
    const listTitle = await fetch(`http://localhost:8080/lists/${listId}`, {
      method: "GET",
    })
    const { listName } = await listTitle.json();
    listForm.innerHTML = `
    <h2>Edit List Name</h2>
    <div id='list-edit'>
      <form class='list-edit-form'>
      <input type='text' class='list-edit' id='title' name='title' placeholder=${listName.title}>
      <label for='title' class='list-label'${listName.title} </label>
      <div>
      <button class='submitButton'>Submit</button>
      </div>
      <div>
      <button class='editCancelButton'>Cancel</button>
      </div>
      </form>
    </div>
      `
      const listUpdate = document.querySelector('.list-edit-form')
      listUpdate.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const formData = new FormData(listUpdate);
        const title = formData.get('title')
        const body = { title }
        await fetch(`http://localhost:8080/lists/${listId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json'
          }
        })
      })
      const cancelButton = document.querySelector('.editCancelButton');
      cancelButton.addEventListener('click', (e) => {
        listForm.innerHTML = '';
      })
  }
})


const logoutButton = document.querySelector("#logout");

window.addEventListener('DOMContentLoaded', async () => {
  const settings = document.querySelector('#settings');

  settings.addEventListener('click', event => {
    event.stopPropagation();
    document.querySelector('.settingGroup').classList.remove('settingHide');
  });

  window.addEventListener('click', () => {
    document.querySelector('.settingGroup').classList.add('settingHide');

    // const editForm = document.querySelector('.edit-form');
    // const form = document.querySelector('.edit-task');
    // editForm.removeChild(form);
    // const editTaskButt = document.querySelector('.edit-task-butt');
    // editTaskButt.disabled = false;
  });

})



const signOutButton = document.querySelector("#signOut");

signOutButton.addEventListener("click", async (e) => {

  e.preventDefault();
  try {
    await fetch("/users/logout", {
      method: "POST"
    })

    window.location.href = "/";
  } catch (err) {
    handleErrors(err)
  }

})

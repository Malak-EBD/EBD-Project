
import './style.css'

document.querySelector('#app').innerHTML = `
  <main>
    <h1 id="project-name">MoneyWise</h1>
    <p>Take control of your finances.</p>
    <button id="explore-btn">Explore MoneyWise</button>
  </main>
`

document.querySelector('#explore-btn').addEventListener('click', () => {
  alert('Welcome to MoneyWise!')
})

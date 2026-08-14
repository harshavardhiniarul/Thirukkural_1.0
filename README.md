# Thirukkural Finder

Thirukkural Finder is a web application that enables users to search for any Thirukkural by entering its number. The application retrieves data from a public Thirukkural API and presents the original Tamil Kural along with its Tamil explanation, chapter (அதிகாரம்), and section (பால்) through a clean and responsive user interface.

## Features

* **Kural Search** – Search any Thirukkural using its unique number (1–1330).
* **Detailed Information** – View the original Tamil Kural, Tamil explanation, chapter (அதிகாரம்), and section (பால்).
* **API Integration** – Retrieves Thirukkural data dynamically from a public API.
* **Input Validation** – Handles invalid inputs with appropriate error messages.
* **Responsive Design** – Provides a consistent user experience across desktop and mobile devices.

## Technologies Used

* HTML5
* CSS3
* JavaScript
* Python Flask
* Thirukkural API

## Screenshots

### Home Page

The home page provides a simple and intuitive interface where users can enter a Thirukkural number and search for the corresponding Kural.

![Home Page](screenshots/homepage.png)

### Search Result

After a successful search, the application displays the selected Thirukkural along with its Tamil explanation, chapter (அதிகாரம்), and section (பால்).

![Search Result](screenshots/output.png)

### Invalid Input

When an invalid Kural number is entered, the application validates the input and displays an appropriate error message.

![Invalid Input](screenshots/validation.png)

## Project Structure


Thirukkural-App/
│
├── static/
│   ├── style.css
│   └── script.js
│
├── templates/
│   └── index.html
│
├── screenshots/
│   ├── home.png
│   ├── result.png
│   └── invalid-input.png
│
├── app.py
├── requirements.txt
└── README.md


## License

This project is developed for educational purposes.


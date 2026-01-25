@startuml
left to right direction

actor "Visiteur" as Visitor
actor "Utilisateur" as User
actor "Admin" as Admin
actor "Enseignant" as Teacher
actor "Etudiant" as Student
actor "Administratif" as Staff

User <|-- Admin
User <|-- Teacher
User <|-- Student
User <|-- Staff

rectangle "Training Academy" {
  (S'inscrire) as UC_Register
  (Se connecter) as UC_Login
  (Se déconnecter) as UC_Logout
  (Consulter tableau de bord) as UC_Dashboard

  (Gérer utilisateurs) as UC_Users
  (Gérer enseignants) as UC_Teachers
  (Gérer étudiants) as UC_Students
  (Gérer cours) as UC_Courses
  (Gérer notes) as UC_Notes
  (Consulter notes) as UC_ViewNotes
  (Gérer contacts) as UC_Contacts
}

Visitor --> UC_Register
Visitor --> UC_Login

User --> UC_Logout
User --> UC_Dashboard

Admin --> UC_Users
Admin --> UC_Teachers
Admin --> UC_Students
Admin --> UC_Courses
Admin --> UC_Notes
Admin --> UC_Contacts

Teacher --> UC_Notes
Teacher --> UC_Courses

Student --> UC_ViewNotes
Student --> UC_Courses
Student --> UC_Contacts

Staff --> UC_Teachers
Staff --> UC_Students
Staff --> UC_Courses
Staff --> UC_Contacts
@enduml

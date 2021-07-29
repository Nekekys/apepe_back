<h1>Документация API запросов сервера для "apepe"</h1>
server - "https://fierce-sierra-39213.herokuapp.com/"
`GET - /getUser/{user id : string}` - получить данные пользователя
`GET - /setOnline/{user id : string}/{check : bool}` - устоновить в сети или не в сети пользователь
`GET - /getPost/{post id : string}` - получить данные основной ветки постов
`POST - /setPost/{user id : string}` - (post: сформировоный объект поста) добавить пост в основную ветку
`POST - /setBranchPost/{user id : string}/{post id : string}` - (post: сформировоный объект поста) добавить пост в ветку комментария основного поста
`GET - /getBranchPost/{user id : string}/{(основного поста)post id : string}` - получить посты коментариев основного поста
`GET - /pressLikePost/{post id : string}/{(id ставящего лайк)user id : string}/{(id хозяина поста\страницы)host id : string}` - поставить лайк посту
`GET - /addOrRemoveFriend/{(id добавляющего в друзья)user id : string}/{(id добавленного в друзья)host id : string}` - добавить в друзья
`GET - /people/{(колличество пользователей на странице)countUser : number}/{(номер страницы)pageCount : number}` - получить данные пользователей, к примеру если countUser = 10, а 
pageCount = 2, то выдаст пользователей по счету с 10 места по 20
`GET - /peopleSearch/{searchString : string}` - поиск по имени\фамилии
`POST - /upload/{user id : string}` - (post: файл\картинка .png .jpeg) загрузить аватарку
`POST - /uploadBackground/{user id : string}` - (post: файл\картинка .png .jpeg) загрузить фон
`GET - /changeBackground/{user id : string}/{check : bool}` - изменить повторяющийся(false) и не повторяющийся фон(true)
`GET - /changeLogin/{user id : string}/{login : string}` - изменить логин
`GET - /changePassword/{user id : string}/{password : string}` - изменить пароль
`POST - /neuralAnswer` - (post: слово-кирилица мение 20 символов : string) узнать у лягушки нейронки что хорошо(1) что плохо(0)

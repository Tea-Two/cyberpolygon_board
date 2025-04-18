# Red Board

CTF платформа от Red Cadets на базе CTFd

## Автозагрузка ##
Описание к заданию делается в yaml формате следующим образом:
```yaml
version: "3.5"
name: Название
author: iC0nst
category: Cryptography
description: Это тестовое задание
value: 100 # стоимость
type: standard
challenge_token: 89b4ad09932c382930a326fbe3796ff5 # большой токен в хексах (генерацию см. ниже)

flags:
    - {
        type: "online_mutated", #или offline_mutated, или static, или file_mutated
        content: "vka{online_mutated_flag}",
        data: "",
    }

tags:
    - easy

files:
    - task.rar    # Для заданий с offline-мутацией указать архив с флагами и файлами
hints:
    - {
        content: "Подсказка за 10 очков",
        cost: 10
    }
    - Бесплатная подсказка

state: hidden # или visible (если открыт для пользователей)

```
## Античит ##
### Online-мутация ###

Для того, чтобы сгенерировать токен для задания 
- либо выполните следующие команду:
```bash 
python3 -c "import os;print(os.urandom(16).hex())"
```
- либо воспользуйтесь веб интерфейсом CTFd (вкладка создания таска).


Пример получения мутированного флага на python:
```python 
#!/usr/bin/env python3

import os
import requests
from hashlib import sha1


IP = '127.0.0.1' # Адрес платформы 
PORT = 4000      # Порт платформы
URL = "http://{}:{}".format(IP, PORT)

s = requests.Session()
s.timeout = 5

user_ip = "128.2.45.244"
user_ua = "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0"
user_hash = sha1((user_ip + user_ua).encode()).hexdigest()
task_token = "89b4ad09932c382930a326fbe3796ff5"

data  = {"user_hash": user_hash, "task_key": task_token}
print(s.get(URL + "/api/v1/anticheat", params = data).text)
```

### Offline-мутация ###
Данный тип предполагает загрузку флагов, заранее изменённых, и файлов, подготовленных для каждой отдельно взятой команды. 

Для выдачи каждой команде своих файлов, необходимо: 
1. создать флаг типа **offline_mutated**;
2. загрузить архив с файлами и флагами. Структуру архива см. ниже. 

```
task
│   flags.txt         # Файл со всеми флагами    
│
└───teams             # папка с файлами для команд
│   │
│   │
│   └───1             # ID команды
│   │   │ciphertext.txt
│   │
│   └───2  
│   │   │ciphertext.txt
│   │  
│   └───3
│   │   │ciphertext.txt
│   ...
│
│   │
│   └───200
│       │cyphertext.txt
│
└───common             # Общие для всех файлы
    │   source.py
```


### Файловая мутация ###

Предполагается для тасок с socat.

Чтобы прокинуть вольюм на файл с флагом в docker-compose.yaml прописывается: 
```yaml
services:
  task:
    volumes:
      - ${PWD}/flag.txt:/flag
    ...
```

После чего необходимо запустить скрипт, который в определённый момент будет мутировать флаг.

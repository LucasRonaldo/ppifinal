import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";

const app = express();
const host = "0.0.0.0";
const porta = process.env.PORT || 3000;


const interessados = []; 
const pets = []; 
const adocoes = []; 

let nextInteressadoId = 1;
let nextPetId = 1;
let nextAdocaoId = 1;


app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: "PetShop_Adoção_2025",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 30 } 
  })
);


function verificaLogin(req, res, next) {
  if (req.session.logado) return next();
  return res.redirect("/login");
}

function renderPage(title, body) {
  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  </head>
  <body class="bg-light">
    <div class="container py-4">
      ${body}
    </div>
  </body>
  </html>`;
}


app.get("/login", (req, res) => {
  res.send(
    renderPage(
      "Login",
      `
      <div class="col-md-4 mx-auto">
        <h3>Login</h3>
        <form method="POST">
          <input class="form-control mb-2" name="usuario" placeholder="Usuário" required>
          <input type="password" class="form-control mb-2" name="senha" placeholder="Senha" required>
          <button class="btn btn-primary w-100">Entrar</button>
        </form>
      </div>`
    )
  );
});

app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === "admin" && senha === "123") {
    req.session.logado = true;
    return res.redirect("/");
  }

  res.send(
    renderPage(
      "Erro",
      `<div class="alert alert-danger">Login inválido</div>
       <a href="/login" class="btn btn-secondary">Voltar</a>`
    )
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

app.get("/", verificaLogin, (req, res) => {
  const ultimoAcesso = req.cookies.ultimoAcesso;
  const agora = new Date().toLocaleString("pt-BR",{ timeZone: "America/Sao_Paulo"});

  res.cookie("ultimoAcesso", agora, { maxAge: 1000 * 60 * 60 * 24 * 30 });

  res.send(
    renderPage(
      "Menu",
      `
      <div class="card p-4">
        <h3>Menu do Sistema</h3>
        <p><strong>Último acesso:</strong> ${ultimoAcesso || "Primeiro acesso"}</p>

        <a class="btn btn-primary mb-2" href="/interessados/novo">Cadastro de Interessados</a>
        <a class="btn btn-success mb-2" href="/pets/novo">Cadastro de Pets</a>
        <a class="btn btn-info mb-2 text-white" href="/adocao/nova">Adotar um Pet</a>
        <a class="btn btn-danger" href="/logout">Sair</a>
      </div>`
    )
  );
});


app.get("/interessados/novo", verificaLogin, (req, res) => {
  res.send(
    renderPage(
      "Cadastro de Interessados",
      `
      <h3>Cadastro de Interessado</h3>
      <form method="POST">
        <input class="form-control mb-2" name="nome" placeholder="Nome" required>
        <input class="form-control mb-2" name="email" placeholder="Email" required>
        <input class="form-control mb-2" name="telefone" placeholder="Telefone" required>
        <button class="btn btn-success">Cadastrar</button>
      </form>`
    )
  );
});

app.post("/interessados/novo", verificaLogin, (req, res) => {
  const { nome, email, telefone } = req.body;

  if (!nome || !email || !telefone) {
    return res.send(renderPage("Erro", `<div class="alert alert-danger">Todos os campos são obrigatórios</div>`));
  }

  interessados.push({ id: nextInteressadoId++, nome, email, telefone });
  res.redirect("/interessados/listar");
});

app.get("/interessados/listar", verificaLogin, (req, res) => {
  let lista = interessados
    .map(i => `<li class="list-group-item">${i.nome} - ${i.email}</li>`)
    .join("");

  res.send(
    renderPage(
      "Interessados",
      `
      <h3>Interessados Cadastrados</h3>
      <ul class="list-group mb-3">${lista}</ul>
      <a class="btn btn-primary" href="/interessados/novo">Novo</a>
      <a class="btn btn-secondary ms-2" href="/">Menu</a>`
    )
  );
});


app.get("/pets/novo", verificaLogin, (req, res) => {
  res.send(
    renderPage(
      "Cadastro de Pets",
      `
      <h3>Cadastro de Pet</h3>
      <form method="POST">
        <input class="form-control mb-2" name="nome" placeholder="Nome" required>
        <input class="form-control mb-2" name="raca" placeholder="Raça" required>
        <input type="number" class="form-control mb-2" name="idade" placeholder="Idade" required>
        <button class="btn btn-success">Cadastrar</button>
      </form>`
    )
  );
});

app.post("/pets/novo", verificaLogin, (req, res) => {
  const { nome, raca, idade } = req.body;

  if (!nome || !raca || !idade) {
    return res.send(renderPage("Erro", `<div class="alert alert-danger">Todos os campos são obrigatórios</div>`));
  }

  pets.push({ id: nextPetId++, nome, raca, idade });
  res.redirect("/pets/listar");
});

app.get("/pets/listar", verificaLogin, (req, res) => {
  let lista = pets
    .map(p => `<li class="list-group-item">${p.nome} - ${p.raca} (${p.idade} anos)</li>`)
    .join("");

  res.send(
    renderPage(
      "Pets",
      `
      <h3>Pets Cadastrados</h3>
      <ul class="list-group mb-3">${lista}</ul>
      <a class="btn btn-primary" href="/pets/novo">Novo</a>
      <a class="btn btn-secondary ms-2" href="/">Menu</a>`
    )
  );
});


app.get("/adocao/nova", verificaLogin, (req, res) => {
  let optInteressados = interessados.map(i => `<option value="${i.id}">${i.nome}</option>`).join("");
  let optPets = pets.map(p => `<option value="${p.id}">${p.nome}</option>`).join("");

  res.send(
    renderPage(
      "Adotar Pet",
      `
      <h3>Desejo de Adoção</h3>
      <form method="POST">
        <select class="form-select mb-2" name="interessadoId" required>
          <option value="">Selecione o interessado</option>
          ${optInteressados}
        </select>

        <select class="form-select mb-2" name="petId" required>
          <option value="">Selecione o pet</option>
          ${optPets}
        </select>

        <button class="btn btn-success">Registrar Desejo</button>
      </form>`
    )
  );
});

app.post("/adocao/nova", verificaLogin, (req, res) => {
  const { interessadoId, petId } = req.body;

  if (!interessadoId || !petId) {
    return res.send(renderPage("Erro", `<div class="alert alert-danger">Selecione interessado e pet</div>`));
  }

  adocoes.push({
    id: nextAdocaoId++,
    interessadoId,
    petId,
    data: new Date().toLocaleString()
  });

  res.redirect("/");
});

app.listen(porta, host, () => {
  console.log(`Servidor rodando em http://${host}:${porta}`);
});

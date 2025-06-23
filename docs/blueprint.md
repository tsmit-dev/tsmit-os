# **App Name**: TSMIT - Sistema de Controle de OS

## Core Features:

- Criação de nova OS: Suporte externo registra uma OS informando: Cliente (nome, e-mail, telefone), Equipamento (tipo, marca, modelo, número de série), Problema relatado, Nome do analista/coletor
- Atualização de status: Laboratório altera o status da OS conforme o andamento: em_analise, aguardando_peca, finalizada, pronta_entrega, entregue. Ao preencher a solução técnica, o sistema muda automaticamente para pronta_entrega.
- Dashboard “Prontas para Entrega”: Suporte externo acessa uma tela que mostra apenas as OS com status pronta_entrega.
- Log de movimentações da OS: Cada atualização gera um log contendo: Data/hora, usuário responsável, status anterior, status novo, observações
- Notificações automáticas: Ao mudar o status para pronta_entrega, o sistema envia um e-mail automático para o cliente avisando que o equipamento está pronto.
- Controle de Acesso por Perfil: admin: acesso total (relatórios, usuários, configurações), laboratorio: atualiza OS e preenche solução técnica, suporte: cria OS e visualiza prontas para entrega

## Style Guidelines:

- Cor primária: Azul institucional #21628E
- Cor secundária: Azul claro #2F7DAC
- Fundo do painel: Branco #FFFFFF ou cinza claro #F0F0F0
- Fonte recomendada: Inter (Sans-serif)
- Interface moderna, limpa e responsiva
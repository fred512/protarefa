// Metadados dos status de tarefa (valores devem bater com o CHECK do banco)
export const STATUS = {
  a_fazer: { valor: 'a_fazer', label: 'A fazer', cor: '#8A93A6', icon: 'radio_button_unchecked' },
  fazendo: { valor: 'fazendo', label: 'Fazendo', cor: '#FFB454', icon: 'timelapse' },
  feito: { valor: 'feito', label: 'Feito', cor: '#A3E635', icon: 'check_circle' }
}

export const LISTA_STATUS = Object.values(STATUS)

// Cores disponíveis para os cards de projeto
export const CORES_PROJETO = [
  '#7C6FFF', '#A3E635', '#FFB454', '#FF5C7A',
  '#5EC8F8', '#F472B6', '#2DD4BF', '#FB923C'
]

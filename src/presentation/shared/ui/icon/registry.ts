import { PanelLeft } from 'lucide-vue-next'
import type { Component } from 'vue'

// Добавляй иконки сюда по мере роста приложения.
// В бандл попадут только те, что перечислены здесь.
export const iconRegistry: Record<string, Component> = {
  PanelLeft,
}

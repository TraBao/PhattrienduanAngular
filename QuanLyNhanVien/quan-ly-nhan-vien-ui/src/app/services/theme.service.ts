import { Injectable, RendererFactory2, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

    @Injectable({
    providedIn: 'root'
    })
    export class ThemeService {
    private renderer: Renderer2;
    private currentTheme: string = 'light-theme';

    constructor(
        rendererFactory: RendererFactory2,
        @Inject(DOCUMENT) private document: Document
    ) {
        this.renderer = rendererFactory.createRenderer(null, null);
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
        this.setTheme(savedTheme);
        } else {
        this.renderer.addClass(this.document.body, this.currentTheme);
        }
    }
    toggleTheme(): void {
        const newTheme = this.currentTheme === 'dark-theme' ? 'light-theme' : 'dark-theme';
        this.setTheme(newTheme);
    }
    private setTheme(newTheme: string): void {
        this.renderer.removeClass(this.document.body, this.currentTheme);
        this.renderer.addClass(this.document.body, newTheme);
        
        this.currentTheme = newTheme;
        localStorage.setItem('theme', newTheme);
    }

    isDarkTheme(): boolean {
        return this.currentTheme === 'dark-theme';
    }
    }
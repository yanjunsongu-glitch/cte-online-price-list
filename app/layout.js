import './globals.css';

export const metadata={
  title:'Price List — CTE',
  robots:{index:false,follow:false,noarchive:true},
  icons:{icon:'/icon.svg',shortcut:'/icon.svg',apple:'/icon.svg'}
};

export default function RootLayout({children}){
  return <html lang="en"><body>{children}</body></html>
}

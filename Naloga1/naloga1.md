# Naloga 1

Ko smo pognali zaledje aplikacije s komando: `mvn spring-boot:run` smo dobili naslednji error:

![image1.png](slike/image1.png)

To se je zgodilo, ker pom.xml datoteka vsebuje dvojno definicijo istega groupId-ja:

![image2.png](slike/image2.png)

Ko smo to popravili se je zaledje uspešno zagnalo.

Ko smo pognali frontend `npm install` ukaz smo dobili naslednji error, vendar to ni napaka z aplikacijsko kodo vendar z windows sistemom, na katerem smo pognali ukaz, ko smo dodelili ustrezne pravice na windows sistemu, je ukaz deloval normalno:

![image3.png](slike/image3.png)

Standardi:

![image4.png](slike/image4.png)

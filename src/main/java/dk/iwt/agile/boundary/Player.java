package dk.iwt.agile.boundary;

public class Player {
    private final String name;
    private final Boolean isPlayer;
    
    public Player(String name, Boolean isPlayer){
        this.name = name;
        this.isPlayer = isPlayer;
    }

    public String getName() {
        return name;
    }

    public Boolean getIsPlayer() {
        return isPlayer;
    }
    
    
}
